// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const STUDENTINFORMATIONSchema = new mongoose.Schema(
  {
  legal_last_name: { type: String, },
  legal_first_name: { type: String, },
  legal_middle_name: { type: String, },
  birthdate: { type: Date, },
  gender: { type: String, },
  home_phone: { type: String, },
  unlisted: { type: Boolean, },
  address: { type: String, },
  apt_: { type: String, },
  city: { type: String, },
  province: { type: String, },
  postal_code: { type: String, },
  name_of_previous_school: { type: String, },
  district: { type: String, },
  provcountry: { type: String, },
  has_student_attended_a_burnaby_school_or_strongstart_program: { type: Boolean, },
  name_of_school: { type: String, },
  identified_learning_needsspecial_needs_diagnosis_ministry_of_education_designation: { type: Boolean, },
  country_of_birth: { type: String, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['student-information'] ||
  mongoose.model('student-information', STUDENTINFORMATIONSchema, 'student-information');
