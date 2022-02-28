import { Model, Document, Types, Schema, model } from "mongoose";

export interface IProduct {
  id: string;
  price: number;
  title: string;
  imageUrl: string;
  category: string;
}

export interface IProductProps {
  price: number;
  title: string;
  imageUrl: string;
  category: string;
}

interface IProductModel extends Model<IProduct> {
  createProduct(
    props: IProductProps
  ): Document<any, any, IProduct> & IProduct & { _id: Types.ObjectId };
}

const productSchema = new Schema<IProduct, IProductModel>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
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

productSchema.statics.createProduct = function (
  props: IProductProps
): Document<any, any, IProduct> & IProduct & { _id: Types.ObjectId } {
  return new Product(props);
};

export const Product = model<IProduct, IProductModel>("Product", productSchema);
