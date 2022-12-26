const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  fullname: {
    type: String
  },
  email: {
    type: String
  },
  message: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Message',messageSchema);
// the line is used to use this file in other file using const and require it
