import { ValidationError } from "../errors.js";

export const validate = (schema) => (req, _res, next) => {
  try {
    const data = {
      body: req.body,
      params: req.params,
      query: req.query,
    };
    schema.parse(data);
    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return next(new ValidationError("Invalid request payload", { issues: details }));
    }
    return next(new ValidationError("Invalid request payload"));
  }
};
