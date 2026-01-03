import jwt from 'jsonwebtoken'

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')

    if (token){
        try {
            const decoded = jwt.verify(token, 'TOKEN')

            req.userId = decoded._id
            next()
        }catch (e){
            return res.status(401).json({
                message: 'Нема доступа, спочатку зареєструйтесь'
            })
        }
    }else{
        return res.status(401).json({
            message: 'Нема доступа, спочатку зареєструйтесь'
        })
    }
}