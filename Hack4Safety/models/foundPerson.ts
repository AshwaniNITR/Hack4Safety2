import { number } from "framer-motion";
import mongoose from "mongoose";

const foundPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  address: { type: String || Float64Array },
  contactNumber: { type: String },
  dateMissing: { type: Date, required: true },
  imageUrl: { type: String, required: true }, // store Cloud/Local URL
  status: { type: String, enum: ["Missing", "Found"], default: "Missing" },
  solvedAt:{type:Date, required:false, default:Date.now},
  foundPolice:{type:String,required:true},
  contactValue:{type:(String || Number),required:true},
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.foundPerson ||
  mongoose.model("foundPerson", foundPersonSchema);
