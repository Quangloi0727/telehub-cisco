const ldap = require('ldapjs');

module.exports = {
    initConnect,
    searchAgentByUsername,
    changePassByDN,
}

function initConnect(url) {
    return new Promise((resolve, reject) => {
        const client = ldap.createClient({
            url: [url],
            tlsOptions: { 'rejectUnauthorized': false }
        });


        client.on('error', (err) => {
            // handle connection error
            if (err) {
                console.log('err', err);
                reject(err);
            }
        })

        client.on('connect', (result) => {
            // if (err) {
            //     console.log('err', err);
            //     reject(err);
            // }
            // else 
            resolve(client);
        });
    });
}

function searchAgentByUsername(clientAD, username, password, dc1, dc2) {
    return new Promise((resolve, reject) => {

        clientAD.bind(`${username}@${dc1}.${dc2}`, password, (err) => {
            if (err) {
                console.log('err', err);
                reject(err);
            } else {
                const opts = {
                    filter: `(userPrincipalName=${username}*)`,
                    attributes: 'dn',
                    scope: 'sub'
                };

                clientAD.search(`dc=${dc1},dc=${dc2}`, opts, (err, res) => {

                    if (err) {
                        console.log('err', err);
                        reject(err);
                    }

                    res.on('error', (err) => {
                        console.error('error: ' + err.message);
                    });

                    res.on('searchEntry', (entry) => {

                        resolve(entry);
                    });
                })
            }

        });

    });
}

function changePassByDN(clientAD, userDN, oldPass, newPass) {

    return new Promise((resolve, reject) => {
        clientAD.bind(userDN, oldPass, function (err) {
            if (err) {
                console.log('err', err);
                reject(err);
            } else {
                clientAD.modify(userDN, [
                    new ldap.Change({
                        operation: 'delete',
                        modification: {
                            unicodePwd: encodePassword(oldPass)
                        }
                    }),
                    new ldap.Change({
                        operation: 'add',
                        modification: {
                            unicodePwd: encodePassword(newPass)
                        }
                    })
                ], function (err) {
                    if (err) {
                        console.log(1, err.code);
                        console.log(2, err.name);
                        console.log(3, err.message);
                        clientAD.unbind();
                        reject(err.message);
                    }
                    else {
                        resolve('Mật khẩu đã được thay đổi!');
                        clientAD.unbind();
                    }
                });
            }


        });
    });

}

function encodePassword(password) {
    return new Buffer.from('"' + password + '"', 'utf16le').toString();
}
