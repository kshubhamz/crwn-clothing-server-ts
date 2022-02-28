import jwt, { JsonWebTokenError, JwtPayload, Secret } from "jsonwebtoken";

export class JWT {
  static generateJWT<T extends object>(
    payload: T,
    secret: Secret
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(payload, secret, (err, encoded) => {
        if (err) reject(err);
        if (!encoded)
          reject(new JsonWebTokenError("Something went wrong in encoding!"));
        else resolve(encoded);
      });
    });
  }

  static verifyJWT(token: string, secret: Secret): Promise<JwtPayload> {
    return new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) reject(err);
        if (!decoded)
          reject(new JsonWebTokenError("Something went wrong in decoding!"));
        else resolve(decoded as JwtPayload);
      });
    });
  }
}
