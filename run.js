const request = require("request-promise");
const fs = require("fs-extra").promises;
const path = require("path");

const api_url = "https://passport.bilibili.com/web/generic/check/nickname";
const retry_times = 3;
const range = {begin: 0, end: 20005};

Number.prototype.pad = function (size) {
    let s = String(this);
    while (s.length < (size || 5)) {
        s = "0" + s;
    }
    return s;
}

async function check(nickname) {
    let t = 0;
    while (true) {
        try {
            let res = await request.get({
                uri: api_url,
                qs: {nickName: nickname},
                json: true,
                timeout: 10000
            });
            return res.message === "昵称已存在";
        } catch (err) {
            console.log(`error on ${nickname}`);
            t++;
            if (t <= retry_times) {
                console.log(`retrying... (${t})`);
            } else {
                throw err;
            }
        }
    }
}

async function main() {
    let used_file = await fs.open(path.join(__dirname, "used.txt"), "w");
    let unused_file = await fs.open(path.join(__dirname, "unused.txt"), "w");
    let error_file = await fs.open(path.join(__dirname, "error.txt"), "w");

    let count_used = 0, count_unused = 0;
    for (let i = range.begin; i <= range.end; i++) {
        let nickname = `御坂${i}号`;
        if (i % 100 === 0) console.log(`running on ${nickname}`);
        try {
            if (await check(nickname)) {
                count_used++;
                if (count_used % 10) {
                    await used_file.write(nickname + ' ');
                } else {
                    await used_file.write(nickname + '\n');
                }
            } else {
                count_unused++;
                if (count_unused % 10) {
                    await unused_file.write(nickname + ' ');
                } else {
                    await unused_file.write(nickname + '\n');
                }
            }
        } catch (e) {
            console.error(e);
            await error_file.write(`御坂${i}号\n`);
        }
    }

    await used_file.write("\n\n规则命名共计" + count_used + "位御坂\n\n");
    await unused_file.write("\n\n规则命名共计" + count_unused + "位御坂\n\n");

    let count_used_special = 0, count_unused_special = 0;
    for (let i = range.begin; i <= Math.min(9999, range.end); i++) {
        let nickname = `御坂${i.pad(5)}号`;
        if (i % 100 === 0) console.log(`running on ${nickname}`);
        try {
            if (await check(nickname)) {
                count_used++;
                count_used_special++;
                if (count_used_special % 10) {
                    await used_file.write(nickname + ' ');
                } else {
                    await used_file.write(nickname + '\n');
                }
            } else {
                count_unused++;
                count_unused_special++
                if (count_unused_special % 10) {
                    await unused_file.write(nickname + ' ');
                } else {
                    await unused_file.write(nickname + '\n');
                }
            }
        } catch (e) {
            console.error(e);
            await error_file.write(`御坂${i}号\n`);
        }
    }
    await used_file.write("\n\n特殊命名共计" + count_used_special + "位御坂\n\n");
    await unused_file.write("\n\n特殊命名共计" + count_unused_special + "位御坂\n\n");

    await used_file.write("\n\n共计" + count_used + "位御坂");
    await unused_file.write("\n\n共计" + count_unused + "位御坂");

    await used_file.close();
    await unused_file.close();
    await error_file.close();
}

let running = main();