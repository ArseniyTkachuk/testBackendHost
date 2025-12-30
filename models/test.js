import mongoose from "mongoose";

/*  PAIR  */
const PairItemSchema = new mongoose.Schema({
  text: String,
  isImage: {
    type: Boolean,
    default: false
  },
  imageUrl: String,
  slug: String
}, { _id: false });

const PairSchema = new mongoose.Schema({
  left: {
    type: [PairItemSchema],
    required: true
  },
  right: {
    type: [PairItemSchema],
    required: true
  },
  correctMap: {
    type: Map,
    of: Number,
    required: true
  }
}, { _id: false });



/*  ANSWER  */
const AnswerSchema = new mongoose.Schema({
  text: String,
  correct: Boolean,
  isImage: {
    type: Boolean,
    default: false
  },
  imageUrl: String
}, { _id: false });

/*  EXERCISE  */
const ExerciseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pair', 'one', 'many', 'enter'],
    required: true
  },

  question: {
    type: String,
    required: true
  },

  answers: {
    type: [AnswerSchema],
    default: []
  },

  correctAnswers: {
    type: [String],
    default: []
  },

  pairs: {
    type: PairSchema,
    default: null
  },

  slug: {
    type: String,
    required: true
  }

}, { _id: false });


/*  CHILDREN */
const Childrens = new mongoose.Schema({
  slug: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  leaveCount: Number,

  scor: Number,

  userAnswer: {
    type: [Object],
    required: true
  }

}, { _id: false });


/*  TEST  */
const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  exercises: {
    type: [ExerciseSchema],
    required: true
  },

  childrens: {
    type: [Childrens],
    default: []
  }


}, { timestamps: true });

const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);
export default Test;
