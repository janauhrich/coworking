const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  kind: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  special_monthly_offer: {
    type: Number,
    required: false
  },
  company: [{
    name: {
      type: String,
      required: true
    },
    contact_email: {
          type: String,
          required: true
    },
    employee: [{
        first_name: {
            type: String, 
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        preferred_name: {
            type: String
        },
        position: {
            type: String
        },
        birthday: {
            type: Date
        },
        email: {
            type: String,
            required: true
        }
      }]
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
const Units = mongoose.model('Units', schema)

module.exports = Units