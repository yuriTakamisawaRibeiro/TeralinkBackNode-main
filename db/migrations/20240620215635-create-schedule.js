/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedule', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      terapeutaId: {
        type: Sequelize.INTEGER
      },
      data: {
        type: Sequelize.DATE
      },
      hora: {
        type: Sequelize.TIME
      },
      // 0 = cancelado/ 1 = disponivel/ 2 = marcado
      estado: {
        type: Sequelize.ENUM('0','1','2')
      },
      pacienteId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user');
  }
};

  
   
 