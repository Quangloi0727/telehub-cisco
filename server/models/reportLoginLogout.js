exports.reportLoginLogout = async (db, dbMssql, body) => {
  try {
    const { startTime, endTime, type, agents, agentTeams } = body;
    let _query = '';

    if (type == 'total') {
      _query = `
        USE tempdb exec report_login_logout_total_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'
      `;
    }

    if (type == 'by-day') {
      _query = `
        USE tempdb exec report_login_logout_per_day_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'
      `;
    }

    if (type == 'by-time') {
      _query = `
        USE tempdb exec report_login_logout_per_time_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'
      `;
    }

    console.info(`------- _query ------- reportLoginLogout`);
    console.info(_query);
    console.info(`------- _query ------- reportLoginLogout`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * API này có chức năng lấy ra các trạng thái và thời gian login logout của agent
 * Vì sao có API này:
 * - API này được dựa trên API 'report-login-logout'
 * - Vì có một số dự án yêu cầu lấy ra các loại Status khác nhau như:
 *    + AtLunch
 *    + Meeting
 *    + NoACD
 *    + NoAvailable
 *    + Not Ready
 *    + Training
 *    + Xu Ly Phieu
 * - Vì vậy API này được tạo ra để nhằm đáp ứng nhu cầu của khách hàng
 * @param {*} dbMssql 
 * @param {*} body 
 * @returns 
 */
exports.reportChangeStatus = async (dbMssql, body) => {
  try {
    const { type, startTime, endTime, agentTeams, agents } = body;

    let childQuery = '';

    if (type == 'total') {
      childQuery = 'EXEC report_login_logout_total_new_sp @p_startTime ,@p_endTime ,@p_agentTeam ,@p_agentId';
    }

    if (type == 'by-day') {
      childQuery = 'EXEC report_login_logout_per_day_new_sp @p_startTime ,@p_endTime ,@p_agentTeam ,@p_agentId'
    }

    if (type == 'by-time') {
      childQuery = 'EXEC report_login_logout_per_time_new_sp @p_startTime ,@p_endTime ,@p_agentTeam ,@p_agentId';
    }

    let _query = `
      DECLARE @p_startTime datetime = '${startTime}'
      DECLARE @p_endTime datetime = '${endTime}'
      DECLARE @p_agentTeam varchar(2000) = '${agentTeams}'
      DECLARE @p_agentId varchar(2000) = '${agents || '#'}'
      
      USE tempdb
      ${childQuery}
    `;

    console.info(`------- _query ------- reportChangeStatus`);
    console.info(_query);
    console.info(`------- _query ------- reportChangeStatus`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};