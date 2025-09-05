import { ZodError } from "zod";

// Usage: validate({ body: z.object({...}), params: z.object({...}), query: z.object({...}) })
export function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      const validated = {};
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body ?? {});
        Object.assign(req.body || (req.body = {}), parsed);
        validated.body = parsed;
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params ?? {});
        // Express 5 req.params is read-only (getter); mutate the returned object instead of reassigning
        Object.assign(req.params || (req.params = {}), parsed);
        validated.params = parsed;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query ?? {});
        // Express 5 req.query is a getter; do not reassign, just mutate
        Object.assign(req.query || (req.query = {}), parsed);
        validated.query = parsed;
      }
      // Optional: keep a snapshot of validated data
      req.validated = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      next(err);
    }
  };
}

export default validate;
