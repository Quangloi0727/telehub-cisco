exports.reportLoginLogout = async (db, dbMssql, body) => {
  try {
    const { startTime, endTime, type, agents, agentTeams } = body;
    let _query = '';

    if (type == 'total') {
      _query = `
        USE tempdb exec dev_report_login_logout_total ${startTime}, ${endTime}, ${agentTeams}, ${agents}
      `;
    }

    if (type == 'by-day') {
      _query = `
        USE tempdb exec dev_report_login_logout_per_day ${startTime}, ${endTime}, ${agentTeams}, ${agents}
      `;
    }

    _logger.log(`-------  ------- `);
    _logger.log(_query);
    _logger.log(`-------  ------- `);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};