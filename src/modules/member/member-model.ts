import { Document, Schema, model, Types } from "mongoose";

export interface MemberDocument extends Document {
  name: string;
  phone: string;
  group: Types.ObjectId;
  //   user: Types.ObjectId;
  payoutPosition: number;
  createdAt: Date;
  updateAt: Date;
}

const memberSchema = new Schema<MemberDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  payoutPosition: {
    type: Number,
    required: true,
    min: 1,
  },
  //   user: {
  //     type: Schema.Types.ObjectId,
  //     ref: "User",
  //     required: true,
  //     index: true,
  //   },
});

const Member = model<MemberDocument>("Member", memberSchema);
export default Member;
