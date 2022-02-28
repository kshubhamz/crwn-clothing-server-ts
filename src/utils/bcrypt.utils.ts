import bcrypt from "bcrypt";

export class Bcrypt {
  static generateHash(plainStr: string, saltRound: number): Promise<string> {
    return bcrypt.hash(plainStr, saltRound);
  }

  static compareHash(plainStr: string, hashedStr: string): Promise<boolean> {
    return bcrypt.compare(plainStr, hashedStr);
  }
}
