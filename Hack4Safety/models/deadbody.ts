import mongoose from "mongoose";

const deadSchema = new mongoose.Schema({
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  address: { type: String || Float64Array },
  contactNumber: { type: String },
  dateMissing: { type: Date, required: true },
  placeLastSeen: { type: String },
  clothingDescription: { type: String },
  physicalFeatures: { type: String },
  imageUrl: { type: String, required: true }, // store Cloud/Local URL
  embedding: { type: [Number], required: true }, // from /get_embeddings
  status: { type: String, enum: ["Unidentified", "Identified"], default: "Unidentified" },
  solvedAt:{type:Date, required:false, default:Date.now},
  reportFiledBy: {
    name: { type: String },
    designation: { type: String },
    policeStation: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.deadPerson ||
  mongoose.model("deadPerson", deadSchema);
