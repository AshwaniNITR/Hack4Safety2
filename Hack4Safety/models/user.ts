import mongoose from "mongoose";

interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  organisation_type?: string;
  organisation_name?: string;
  role: string;
  permissions?: string[];
  isActive: boolean;
  isVerified: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  verificationToken?: string;
  verificationTokenExpire?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6,
    select: false
  },
  organisation_type: { 
    type: String, 
    enum: ["ngo", "hospital", "public", "municipality"],
    required: function(this: IUser) {
      return this.role === "organisation_user";
    }
  },
  organisation_name: { 
    type: String, 
    required: function(this: IUser) {
      return this.role === "organisation_user";
    },
    trim: true
  },
  role: { 
    type: String, 
    enum: ["public", "organisation_user", "admin"], 
    required: true,
    default: "public"
  },
  permissions: [{
    type: String,
    enum: [
      "create_report",
      "view_reports",
      "edit_report",
      "delete_report",
      "manage_users",
      "view_analytics",
      "manage_complaints",
      "assign_tasks"
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verificationToken: String,
  verificationTokenExpire: Date,
  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ organisation_type: 1 });

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);