import { Document, Schema, model, Types } from "mongoose";

export const FREQUENCIES = ["weekly", "monthly"] as const;
export const STATUSES = ["draft", "active", "completed"] as const;

export type Frequency = (typeof FREQUENCIES)[number];
export type GroupStatus = (typeof STATUSES)[number];

export interface GroupDocument extends Document {
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  status: GroupStatus;
  organizer: Types.ObjectId;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<GroupDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contributionAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    frequency: {
      type: String,
      enum: FREQUENCIES,
      required: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "draft",
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: { type: Date },
  },
  { timestamps: true },
);

const Group = model<GroupDocument>("Group", groupSchema);
export default Group;
