import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

// створюємо транспортер один раз
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// функція для відправки коду
export const sendVerificationCode = async (userEmail, userId, UserModel) => {
  // 1. Генеруємо код
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Хешуємо код
  const codeHash = await bcrypt.hash(code, 10);

  // 3. Зберігаємо хеш та час закінчення дії в базі
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 хв
  await UserModel.findByIdAndUpdate(userId, {
    emailCodeHash: codeHash,
    emailCodeExpires: expires
  });

  // 4. Відправляємо лист
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: "Підтвердження email",
    html: `
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    color: #333;
    padding: 24px;
    max-width: 480px;
    margin: 0 auto;
  ">

    <h2 style="margin-bottom: 12px;">
      Підтвердження email
    </h2>

    <p style="font-size: 15px; line-height: 1.6;">
      Ви намагаєтесь підтвердити свій email.  
      Введіть код нижче, щоб завершити реєстрацію:
    </p>

    <div style="
      font-size: 26px;
      font-weight: bold;
      margin: 20px 0;
      padding: 12px 0;
      text-align: center;
      background: #f5f5f5;
      border-radius: 6px;
      letter-spacing: 4px;
    ">
      ${code}
    </div>

    <p style="font-size: 14px; color: #666;">
      Код дійсний <strong>10 хвилин</strong>.
    </p>

    <hr style="border: none; border-top: 2px solid #e0e0e0; margin: 24px 0;">

    <p style="font-size: 14px; color: #999;">
      Якщо ви не реєструвалися — просто проігноруйте цей лист.
    </p>

  </div>
`


  });
};


export const sendLinkForgot = async (userEmail, userId, baseURL, UserModel) => {
  // 1. Генеруємо код
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. Хешуємо код
  const hash = await bcrypt.hash(resetToken, 10);

  // 3. Зберігаємо хеш та час закінчення дії в базі
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 хв
  await UserModel.findByIdAndUpdate(userId, {
    emailCodeHash: hash,
    emailCodeExpires: expires
  });

  // створюємо посилання
  const resetUrl = `${baseURL}?token=${resetToken}&email=${userEmail}`;


  // 4. Відправляємо лист
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: "Відновлення паролю",
    html: `
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    color: #333;
    padding: 24px;
    max-width: 480px;
    margin: 0 auto;
  ">

    <h2 style="margin-bottom: 12px;">
      Відновлення паролю
    </h2>

    <p style="font-size: 15px; line-height: 1.6;">
      Ви намагаєтесь відновити пароль.  
      Перейдіть за посиланням нище щоб скинути пароль:
    </p>

    <div style="
      font-size: 26px;
      font-weight: bold;
      margin: 20px 0;
      padding: 12px 0;
      text-align: center;
      background: #f5f5f5;
      border-radius: 6px;
      letter-spacing: 4px;
    ">
      <a href="${resetUrl}" style="
        color: #4ea1ff;
        text-decoration: none;
        border-bottom: 1px solid transparent;
        cursor: pointer;
        transition: color 0.2s ease, border-color 0.2s ease;
      ">Скинути пароль</a>
    </div>

    <p style="font-size: 14px; color: #666;">
      Код дійсний <strong>10 хвилин</strong>.
    </p>

    <hr style="border: none; border-top: 2px solid #e0e0e0; margin: 24px 0;">

    <p style="font-size: 14px; color: #999;">
      Якщо ви не реєструвалися — просто проігноруйте цей лист.
    </p>

  </div>
`
  });

}
