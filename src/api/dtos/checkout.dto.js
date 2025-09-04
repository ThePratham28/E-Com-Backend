import { z } from "zod";

export const checkoutDto = z.object({
  paymentMethod: z.enum(["card", "cod", "wallet", "upi", "bank_transfer"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .nonempty(),
});

export default { checkoutDto };
