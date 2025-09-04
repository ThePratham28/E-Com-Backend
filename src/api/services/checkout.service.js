import { startSession } from "mongoose";
import { Order, Payment, Product, CartItem } from "../../models/index.js";

/**
 * checkout({ userId, items, paymentMethod })
 * items: [{ productId, quantity }]
 * Returns { order, payment }
 */
export async function checkout({ userId, items, paymentMethod }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items are required for checkout");
  }

  const session = await startSession();
  try {
    let orderDoc;
    let paymentDoc;

    await session.withTransaction(async () => {
      // Load products and ensure availability
      const productIds = items.map((i) => i.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      })
        .session(session)
        .lean();

      const byId = new Map(products.map((p) => [p._id.toString(), p]));
      for (const it of items) {
        const p = byId.get(String(it.productId));
        if (!p)
          throw new Error(`Product ${it.productId} not found or inactive`);
        if (it.quantity <= 0)
          throw new Error(`Invalid quantity for ${it.productId}`);
        if (p.stockQuantity < it.quantity)
          throw new Error(`Insufficient stock for SKU ${p.sku}`);
      }

      // Build order items with current pricing
      const orderItems = items.map((it) => {
        const p = byId.get(String(it.productId));
        const unitPrice = Number(p.price);
        return {
          product: p._id,
          quantity: it.quantity,
          unitPrice,
          totalPrice: unitPrice * it.quantity,
        };
      });

      const totalAmount = orderItems.reduce((s, i) => s + i.totalPrice, 0);

      orderDoc = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            status: "pending",
            totalAmount,
          },
        ],
        { session }
      );
      orderDoc = orderDoc[0];

      paymentDoc = await Payment.create(
        [
          {
            amount: totalAmount,
            order: orderDoc._id,
            paymentMethod,
            status: "pending",
            user: userId,
          },
        ],
        { session }
      );
      paymentDoc = paymentDoc[0];

      // Decrement stock
      for (const it of items) {
        const res = await Product.updateOne(
          { _id: it.productId, stockQuantity: { $gte: it.quantity } },
          { $inc: { stockQuantity: -it.quantity } },
          { session }
        );
        if (res.modifiedCount !== 1)
          throw new Error("Concurrent stock update failed");
      }

      // Clear cart entries for these items
      await CartItem.deleteMany({
        user: userId,
        product: { $in: productIds },
      }).session(session);
    });

    return { order: orderDoc, payment: paymentDoc };
  } finally {
    await session.endSession();
  }
}

export default { checkout };
