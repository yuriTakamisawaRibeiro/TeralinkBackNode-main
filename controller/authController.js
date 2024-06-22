const user = require('../db/models/user');
const Schedule = require('../db/models/schedule')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const mysql = require('mysql2/promise');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};


const login = async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password ) {
        return res.status(400).json({
            status: 'fail',
            message: 'Digite o email ou senha.'
        });
    }

    const result = await user.findOne({where: { email }});
    if(!result || !(await bcrypt.compare(password, result.password))) {
        return res.status(401).json({
            status: 'fail',
            message: 'Email ou senha incorretos.'
        });
    }

    const token = generateToken({
        id: result.id,
    });

    return res.json({
        status: 'success',
        token,
    })


}

const logout = (req, res, next) => {
   
    res.cookie('token', '', { expires: new Date(0) }); // Define o cookie para expirar imediatamente
    res.status(200).json({
        status: 'success',
        message: 'Logout realizado com sucesso.'
    });
};



const signup = async (req, res, next) => {
    const body = req.body;

    if (!['1', '2'].includes(String(body.userType))) {
        return res.status(400).json({
            status: 'fail',
            message: 'User Type inválido'
        });
    }

    try {
        // Determina qual campo verificar com base no userType
        const fieldToCheck = body.userType === '1'? 'cpf' : 'cfm';

        // Verifica se o campo especificado já existe
        const existingUser = await user.findOne({
            where: {
                [fieldToCheck]: body[fieldToCheck]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                status: 'fail',
                message: 'CPF ou CFM já existem.'
            });
        }

        // Determina quais campos são obrigatórios com base no userType
        const requiredField = body.userType === '1'? 'cfm' : 'cpf';
        const optionalField = body.userType === '1'? 'cpf' : 'cfm';

        // Criando o novo usuário e esperando a promessa ser resolvida
        const hashedPassword = await bcrypt.hash(body.password, 10); // Criptografa a senha
        const newUser = await user.create({
            userType: body.userType,
            name: body.name,
            email: body.email,
            cpf: body.cpf,
            cfm: body.cfm,
            password: hashedPassword // Armazena a senha criptografada
        });

        // Converte o modelo criado em JSON
        const result = newUser.toJSON();

        delete result.password;
        delete result.deletedAt;

        result.token = generateToken({
            id: result.id
        });

        return res.status(201).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            status: 'fail',
            message: 'Erro ao criar usuário.'
        });
    }
};



const updateUser = async (req, res, next) => {
    const { id } = req.params; // Obtém o ID do usuário a partir dos parâmetros da requisição
    const body = req.body; // Obtém os novos dados do corpo da requisição

    try {
        // Verifica se o usuário existe antes de tentar atualizá-lo
        const existingUser = await user.findByPk(id);
        if (!existingUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'Usuário não encontrado.'
            });
        }

        // Prepara os campos para atualização
        let fieldsToUpdate = {};
        const updateableFields = ['name', 'email', 'password'];

        updateableFields.forEach(field => {
            if (body[field]) {
                fieldsToUpdate[field] = body[field];
            }
        });

        // Atualiza o usuário no banco de dados
        const updatedUser = await user.update(fieldsToUpdate, { where: { id: id } });

        if (updatedUser[0] === 1) {
            // Retorna os dados atualizados do usuário
            const updatedResult = await user.findByPk(id);
            delete updatedResult.password; // Remover a senha do resultado para segurança
            return res.status(200).json({
                status: 'success',
                data: updatedResult
            });
        } else {
            return res.status(500).json({
                status: 'fail',
                message: 'Erro ao atualizar o usuário.'
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro interno do servidor.'
        });
    }
};


const deleteUser = async (req, res, next) => {
    const { id } = req.params; // Obtém o ID do usuário a partir dos parâmetros da requisição

    try {
        // Verifica se o usuário existe antes de tentar excluí-lo
        const existingUser = await user.findByPk(id);
        if (!existingUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'Usuário não encontrado.'
            });
        }

        // Deleta o usuário do banco de dados
        const deletedUser = await user.destroy({ where: { id: id } });

        if (deletedUser > 0) {
            return res.status(200).json({
                status: 'success',
                message: 'Usuário excluído com sucesso.'
            });
        } else {
            return res.status(500).json({
                status: 'fail',
                message: 'Erro ao excluir o usuário.'
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro interno do servidor.'
        });
    }
};




const getAllUsers = async (req, res, next) => {
    try {
        // Busca todos os usuários no banco de dados
        const users = await user.findAll({
            attributes: { exclude: ['password'] }, // Exclui a coluna de senha dos resultados
        });

        // Retorna os usuários encontrados
        return res.status(200).json({
            status: 'success',
            data: users
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro ao buscar usuários.'
        });
    }
};


const getUserById = async (req, res, next) => {
    const { id } = req.params; // Obtém o ID do usuário a partir dos parâmetros da requisição

    try {
        // Busca o usuário pelo ID no banco de dados
        const userFound = await user.findByPk(id);

        if (!userFound) {
            return res.status(404).json({
                status: 'fail',
                message: 'Usuário não encontrado.'
            });
        }

        // Remove a senha do objeto do usuário para segurança
        delete userFound.password;
        delete userFound.id;
        delete userFound.email;
        delete userFound.userType;

        // Retorna o usuário encontrado
        return res.status(200).json({
            status: 'success',
            data: userFound
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro ao buscar usuário.'
        });
    }
};

const changePassword = async (req, res, next) => {
    const { id } = req.user; // Obtém o ID do usuário a partir dos dados do usuário logado
    const { oldPassword, newPassword } = req.body; // Obtém as senhas do corpo da requisição

    try {
        // Verifica se o usuário existe antes de tentar atualizar a senha
        const existingUser = await user.findByPk(id);
        if (!existingUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'Usuário não encontrado.'
            });
        }

        // Verifica se a senha antiga está correta
        const isMatch = await bcrypt.compare(oldPassword, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'fail',
                message: 'Senha antiga incorreta.'
            });
        }

        // Atualiza a senha do usuário no banco de dados
        const hashedPassword = await bcrypt.hash(newPassword, 10); // Criptografa a nova senha
        existingUser.password = hashedPassword;
        const updatedUser = await existingUser.save();

        // Retorna sucesso
        return res.status(200).json({
            status: 'success',
            message: 'Senha atualizada com sucesso.'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro interno do servidor.'
        });
    }
};
const changeEmail = async (req, res, next) => {
    const { id } = req.user;
    const { newEmail } = req.body;

    try {
        const existingUser = await user.findByPk(id);
        if (!existingUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'Usuário não encontrado.'
            });
        }

        existingUser.email = newEmail;
        const updatedUser = await existingUser.save();

        return res.status(200).json({
            status: 'success',
            message: 'Email atualizado com sucesso.'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro interno do servidor.'
        });
    }
};
const schedule = async (req, res, next) => {
    try {
      const { data, hora } = req.body; // Dados do agendamento
      const terapeutaId = req.user.id; // ID do usuário autenticado
  
      // Lógica para criar o agendamento no banco de dados
      const novoAgendamento = await Schedule.create({
        terapeutaId,
        data,
        hora,
        estado: '1',
        pacienteId: null
      });
  
      // Agendamento criado com sucesso!
      res.status(201).json({ message: 'Agendamento criado com sucesso!', agendamento: novoAgendamento });
    } catch (error) {
      // Trate possíveis erros
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
  };
  const getScheduleFromDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Execute a consulta SQL para obter os agendamentos, incluindo o campo 'data'
        const [rows] = await connection.execute('SELECT id, data, hora FROM schedule WHERE estado = "1"');

        // Feche a conexão
        connection.end();

        return rows; // Retorna os agendamentos reais
    } catch (error) {
        console.error('Erro ao obter agendamentos do banco de dados:', error);
        return []; // Em caso de erro, retorne um array vazio
    }
};
  const getScheduleByEstado = async (req, res) => {
    try{
    const agendamentos = await getScheduleFromDB();
        res.json(agendamentos);
      } catch (error) {
        res.status(500).json({ error: 'Erro ao obter agendamentos do banco de dados' });
      }}
      const testGetSchedule = async () => {
        try {
          const agendamentos = await getScheduleFromDB();
          console.log('Agendamentos obtidos:', agendamentos);
        } catch (error) {
          console.error('Erro ao obter agendamentos:', error);
        }
      };
      const scheduleUpdate = async (req, res) => {
        const { id } = req.params; // ID do agendamento
        const pacienteId = req.user.id;
        if (!id) { // Verifica se o ID foi extraído
            return res.status(400).json({ error: 'ID do agendamento é obrigatório' });
          }
    
        try {
            
            
            const novoAgendamento = await Schedule.update({
                estado: '2',
                pacienteId
            }, {
                where:{
                    id: id
                }
            })
           
            
    
            res.status(200).json({ message: 'Agendamento atualizado com sucesso!' });
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            res.status(500).json({ error: 'Erro ao atualizar agendamento' });
        }
    };

      

const changeName = async (req, res, next) => {
    const { id } = req.user;
    const { newName } = req.body;

    try {
        const existingUser = await user.findByPk(id);
        if (!existingUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'Usuário não encontrado.'
            });
        }

        existingUser.name = newName;
        const updatedUser = await existingUser.save();

        return res.status(200).json({
            status: 'success',
            message: 'Nome atualizado com sucesso.'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Erro interno do servidor.'
        });
    }

    
    
    
};
testGetSchedule();


module.exports = { signup, login, deleteUser, updateUser, logout, getAllUsers, getUserById, changePassword, changeEmail,changeName,schedule, getScheduleByEstado, scheduleUpdate};




