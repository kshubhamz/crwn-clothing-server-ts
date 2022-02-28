import { cartItemSchema, ICartItem } from "./cart-item.schema";
import { IUser } from "./user";
import { Schema, Model, Document, Types, model } from "mongoose";

export interface IOrder {
  id: string;
  price: number;
  products: ICartItem[];
  user: IUser;
  stripeId: string;
  createdAt: Date;
}

interface IOrderProps {
  price: number;
  products: { quantity: number; product: string }[];
  user: IUser;
  stripeId: string;
}

interface IOrderModel extends Model<IOrder> {
  createOrder(
    props: IOrderProps
  ): Document<any, any, IOrder> & IOrder & { _id: Types.ObjectId };
}

const orderSchema = new Schema<IOrder, IOrderModel>(
  {
    price: { type: Number, min: 0, required: true },
    products: [{ type: cartItemSchema }],
    user: { type: Types.ObjectId, required: true, ref: "User" },
    stripeId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
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

orderSchema.statics.createOrder = function (
  props: IOrderProps
): Document<any, any, IOrder> & IOrder & { _id: Types.ObjectId } {
  return new Order(props);
};

export const Order = model<IOrder, IOrderModel>("Order", orderSchema);
