const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Obtém o token do cabeçalho da requisição
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); // Se não houver token, retorna um erro 401 (Não Autorizado)
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Se o token for inválido, retorna um erro 403 (Proibido)
        }

        req.user = user; // Salva os dados do usuário na requisição para uso posterior

        next(); // Passa para o próximo middleware ou rota
    });
};

module.exports = authenticateToken;