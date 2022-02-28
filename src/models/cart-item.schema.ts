import { IProduct } from "./product";
import { Schema, Types } from "mongoose";

export interface ICartItem {
  product: IProduct;
  quantity: number;
}

export const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Types.ObjectId, ref: "Product" },
    quantity: { type: Number, min: 1 },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);
