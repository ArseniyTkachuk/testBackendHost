import { body } from 'express-validator'

export const registerValidator = [
    body('email', 'Неправильний формат адреси').isEmail(),
    body('password', 'Пароль має складатися мінімум з 6 символів').isLength({ min: 5}),
    body('name', 'Імя має складатися мінімум з 3 символів').isLength({ min: 3}),
]

export const loginValidator = [
    body('email', 'Неправильний формат адреси').isEmail(),
    body('password', 'Пароль має складатися мінімум з 6 символів').isLength({ min: 5}),
]