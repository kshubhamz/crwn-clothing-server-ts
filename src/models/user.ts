import { ServerErrorResponse } from "@kz-ts/express-common";
import {
  Schema,
  ValidatorProps,
  Model,
  Document,
  Types,
  model,
} from "mongoose";
import { environment } from "../environment";
import { Bcrypt } from "../utils/bcrypt.utils";
import { ICartItem, cartItemSchema } from "./cart-item.schema";
import { IOrder } from "./order";

export interface IUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  authId?: string;
  currentCartItems: ICartItem[];
  ordersPlaced: IOrder[];
}

export interface IUserProps {
  email: string;
  name: string;
  password: string;
}

interface IUserModel extends Model<IUser> {
  createUser(props: IUserProps): Document<any, any, IUser> &
    IUser & {
      _id: Types.ObjectId;
    };
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: [true, "Email is a mandatory field."],
      unique: true,
      validate: {
        validator: (value: string): boolean =>
          /^[a-z][a-z0-9\._-]+[@][a-z]+[.][a-z]+$/.test(value),
        message: (props: ValidatorProps): string =>
          `Not a valid email: ${props.value}`,
      },
    },
    name: {
      type: String,
      required: [true, "Name is a mandatory field."],
      validate: {
        validator: (value: string): boolean => /^[A-Z][A-Za-z ]+$/.test(value),
        message: (props: ValidatorProps): string =>
          `Not a valid name: ${props.value}`,
      },
    },
    password: {
      type: String,
      validate: {
        validator: (value: string): boolean =>
          /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(
            value
          ),
        message: (props: ValidatorProps): string => `Not a strong password`,
      },
    },
    authId: { type: String },
    currentCartItems: [{ type: cartItemSchema, required: true, default: [] }],
    ordersPlaced: [{ type: Types.ObjectId, ref: "Order", default: [] }],
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
      },
    },
  }
);

userSchema.statics.createUser = function (props: IUserProps): Document<
  any,
  any,
  IUser
> &
  IUser & {
    _id: Types.ObjectId;
  } {
  return new User(props);
};

userSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) {
    next();
    return;
  }

  Bcrypt.generateHash(user["password"], parseInt(environment.SALT_ROUND))
    .then((hashed) => {
      user["password"] = hashed;
      next();
    })
    .catch((err) => {
      next(
        ServerErrorResponse.InternalServer(
          "Something went wrong in genarating hash!"
        )
      );
    });
});

export const User = model<IUser, IUserModel>("User", userSchema);
