import Test from '../models/test.js';
import mongoose from 'mongoose';

/*  HELPERS  */

const isValidIndex = (index, arr) =>
  Number.isInteger(index) && index >= 0 && index < arr.length;

const validateExercise = (ex) => {
  if (!ex.type || !ex.question) {
    return 'Кожне питання повинно мати тип і текст';
  }

  /*  ONE  */
  if (ex.type === 'one') {
    const correctCount = ex.answers?.filter(a => a.correct).length || 0;
    if (correctCount !== 1) {
      return 'Питання з однією відповіддю повинно мати рівно одну правильну';
    }
  }

  /*  MANY  */
  if (ex.type === 'many') {
    const correctCount = ex.answers?.filter(a => a.correct).length || 0;
    if (correctCount < 1) {
      return 'Питання з кількома відповідями повинно мати хоча б одну правильну';
    }
  }

  /*  ENTER  */
  if (ex.type === 'enter') {
    if (!ex.correctAnswers || ex.correctAnswers.length === 0) {
      return 'Питання з введенням повинно мати правильну відповідь';
    }
  }

  /*  PAIR  */
  if (ex.type === 'pair') {
    const { left, right, correctMap } = ex.pairs || {};

    if (!left?.length || !right?.length) {
      return 'Пари повинні мати ліву і праву колонки';
    }

    if (right.length < left.length) {
      return 'Правих варіантів повинно бути не менше ніж лівих';
    }

    for (let i = 0; i < left.length; i++) {
      const mappedIndex = Number(correctMap?.[i]);
      if (!isValidIndex(mappedIndex, right)) {
        return 'Некоректна відповідність у парах';
      }
    }
  }

  return null;
};

/*  CONTROLLER  */

export const createTest = async (req, res) => {
  try {
    const { title, exercises } = req.body;

    if (!title || !exercises) {
      return res.status(400).json({ message: 'Невалідні дані' });
    }

    let parsedExercises;
    try {
      parsedExercises = JSON.parse(exercises);
      parsedExercises.forEach((ex, index) => {
        ex.slug = `${index}`;
        if (ex.type === "pair") {
          ex.pairs.left.forEach((l, lIndex) => {
            l.slug = `${lIndex}`;
          })
          ex.pairs.right.forEach((r, rIndex) => {
            r.slug = `${rIndex}`;
          })
        }
      });

    } catch (err) {
      return res.status(400).json({
        message: 'Некоректний формат exercises'
      });
    }

    /*  VALIDATION  */
    for (const ex of parsedExercises) {
      const error = validateExercise(ex);
      if (error) {
        return res.status(400).json({ message: error });
      }
    }

    if (req.files?.length) {
      req.files.forEach(file => {

        /* ANSWER IMAGE */
        const answerMatch = file.fieldname.match(/q(\d+)\]\[a(\d+)/);
        if (answerMatch) {
          const q = Number(answerMatch[1]);
          const a = Number(answerMatch[2]);

          const answer = parsedExercises[q]?.answers?.[a];
          if (answer) {
            answer.isImage = true;
            answer.imageUrl = `/uploads/${file.filename}`;
          }
          return;
        }

        /* PAIR RIGHT IMAGE */
        const pairRightMatch = file.fieldname.match(/pairImages\[q(\d+)\]\[r(\d+)/);
        if (pairRightMatch) {
          const q = Number(pairRightMatch[1]);
          const r = Number(pairRightMatch[2]);

          const right = parsedExercises[q]?.pairs?.right?.[r];
          if (right) {
            right.imageUrl = `/uploads/${file.filename}`;
          }
          return;
        }

        /* PAIR LEFT IMAGE */
        const pairLeftMatch = file.fieldname.match(/pairImages\[q(\d+)\]\[l(\d+)/);
        if (pairLeftMatch) {
          const q = Number(pairLeftMatch[1]);
          const l = Number(pairLeftMatch[2]);

          const left = parsedExercises[q]?.pairs?.left?.[l];
          if (left) {
            left.imageUrl = `/uploads/${file.filename}`;
          }
        }

      });
    }


    /*  SAVE  */
    const test = new Test({
      title,
      author: new mongoose.Types.ObjectId(req.userId),
      exercises: parsedExercises
    });

    await test.save();

    res.json({
      success: true,
      id: test._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Помилка при створенні тесту',
      error: err.message
    });
  }
};

export const getTest = async (req, res) => {
  try {
    const testid = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(testid)) {
      return res.status(400).json({ message: "Невірний ID тесту" });
    }

    const test = await Test.findById(testid).lean();

    if (!test) {
      return res.status(404).json({ message: "Тест не знайдено" });
    }

    // Перемішуємо масив exercises
    const shuffledExercises = test.exercises
      .map(ex => ({ ...ex })) // створюємо копії, щоб не змінювати оригінал
      .sort(() => Math.random() - 0.5);

    // Приховуємо правильні відповіді
    const sanitizedExercises = shuffledExercises.map(ex => {
      const newEx = { ...ex };

      // Для типу one/many
      if (newEx.answers) {
        newEx.answers = newEx.answers.map(a => {
          const { correct, ...rest } = a; // видаляємо correct
          return rest;
        });
      }

      // Для пар
      if (newEx.pairs) {
        const { correctMap, ...pairsRest } = newEx.pairs;
        newEx.pairs = pairsRest;
      }

      // Для введення
      if (newEx.correctAnswers) {
        newEx.correctAnswers = []; // очищаємо correctAnswers
      }

      // Якщо є поле correctAnswerIndex для one-відповіді
      if ('correctAnswerIndex' in newEx) {
        delete newEx.correctAnswerIndex;
      }

      return newEx;
    });

    res.json({
      ...test,
      exercises: sanitizedExercises
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Помилка сервера",
      error: err.message
    });
  }
};

export const checkTest = async (req, res) => {
  try {
    let scor = 0;
    const { userAnswers, name } = req.body;
    const testid = req.params.id;

    if (!name) {
      return res.status(400).json({ message: "Імʼя обовʼязкове" });
    }

    if (!mongoose.Types.ObjectId.isValid(testid)) {
      return res.status(400).json({ message: "Невірний ID тесту" });
    }

    const test = await Test.findById(testid);

    if (!test) {
      return res.status(404).json({ message: "Тест не знайдено" });
    }

    const exBal = 100 / test.exercises.length;

    /*  ПЕРЕВІРКА ВІДПОВІДЕЙ  */
    test.exercises.forEach((ex) => {
      const userAnsw = userAnswers.find(a => a.slug === ex.slug);
      if (!userAnsw) return;

      // ONE
      if (ex.type === "one") {
        if (ex.answers[userAnsw.value]?.correct) {
          scor += exBal;
        }
      }

      // MANY
      if (ex.type === "many") {
        const correctIndexes = ex.answers
          .map((a, i) => a.correct ? i : null)
          .filter(i => i !== null);

        const part = exBal / correctIndexes.length;

        userAnsw.value.forEach(i => {
          if (correctIndexes.includes(i)) {
            scor += part;
          }
        });
      }

      // ENTER
      if (ex.type === "enter") {
        if (ex.correctAnswers.includes(userAnsw.value)) {
          scor += exBal;
        }
      }

      // PAIR
      if (ex.type === "pair") {
        let correctCount = 0;
        const total = ex.pairs.left.length; // кількість лівих елементів

        userAnsw.value.forEach(([lSlug, rSlug]) => {
          const leftIndex = ex.pairs.left.findIndex(l => l.slug === lSlug);
          const rightIndex = ex.pairs.right.findIndex(r => r.slug === rSlug);

          // Для Map ключі автоматично зберігаються як рядки
          if (ex.pairs.correctMap.get(String(leftIndex)) === rightIndex) {
            correctCount++;
          }
        });

        scor += (exBal / total) * correctCount;
      }

    });

    /*  ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТУ  */
    const finalScore = Number(scor.toFixed(2));

    test.childrens.push({
      name,
      scor: finalScore
    });

    await test.save();

    res.json({
      success: true,
      score: finalScore,
      max: 100
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Помилка сервера",
      error: err.message
    });
  }
};


export const getOneTest = async (req, res) => {
  try {
    const testid = req.params.id;

    const test = await Test.findById(testid).lean();

    if (!test) {
      return res.status(404).json({ message: "Тест не знайдено" });
    }

    res.json({
      test
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Помилка сервера",
      error: err.message
    });
  }

}
