const fsPromises = require("fs-extra").promises;
const moment = require("moment");
const path = require("path");
const requestPromise = require("request-promise");

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
            let res = await requestPromise.get({
                uri: "https://passport.bilibili.com/web/generic/check/nickname",
                qs: {nickName: nickname},
                json: true,
                timeout: 10000,
                header: {
                    "Accept": "application/json, text/plain, */*",
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                        "Chrome/81.0.4044.122 Safari/537.36",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "zh-CN,zh;q=0.9"
                }
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
    let used_buffer_list = [];
    let unused_buffer_list = [];
    let error_buffer_list = [];

    let has_error = false;
    let count_used = 0, count_unused = 0;
    for (let i = range.begin; i <= range.end; i++) {
        let nickname = `御坂${i}号`;
        if (i % 100 === 0) console.log(`running on ${nickname}`);
        try {
            if (await check(nickname)) {
                count_used++;
                if (count_used % 10) {
                    used_buffer_list.push(Buffer.from(nickname + ' ', "utf8"));
                } else {
                    used_buffer_list.push(Buffer.from(nickname + '\n', "utf8"));
                }
            } else {
                count_unused++;
                if (count_unused % 10) {
                    unused_buffer_list.push(Buffer.from(nickname + ' ', "utf8"));
                } else {
                    unused_buffer_list.push(Buffer.from(nickname + '\n', "utf8"));
                }
            }
        } catch (err) {
            has_error = true;
            console.error(err);
            error_buffer_list.push(Buffer.from(nickname + '\n' +
                err.toString() + "\n\n", "utf8"));
        }
    }

    used_buffer_list.push(Buffer.from("\n\n规则命名共计" +
        count_used + "位御坂妹妹\n\n", "utf8"));
    unused_buffer_list.push(Buffer.from("\n\n规则命名共计" +
        count_unused + "位御坂妹妹\n\n", "utf8"));

    let count_used_special = 0, count_unused_special = 0;
    for (let i = range.begin; i <= Math.min(9999, range.end); i++) {
        let nickname = `御坂${i.pad(5)}号`;
        if (i % 100 === 0) console.log(`running on ${nickname}`);
        try {
            if (await check(nickname)) {
                count_used++;
                count_used_special++;
                if (count_used_special % 10) {
                    used_buffer_list.push(Buffer.from(nickname + ' ', "utf8"));
                } else {
                    used_buffer_list.push(Buffer.from(nickname + '\n', "utf8"));
                }
            } else {
                count_unused++;
                count_unused_special++
                if (count_unused_special % 10) {
                    unused_buffer_list.push(Buffer.from(nickname + ' ', "utf8"));
                } else {
                    unused_buffer_list.push(Buffer.from(nickname + '\n', "utf8"));
                }
            }
        } catch (err) {
            has_error = true;
            console.error(err);
            error_buffer_list.push(Buffer.from(nickname + '\n' +
                err.toString() + "\n\n", "utf8"));
        }
    }
    used_buffer_list.push(Buffer.from("\n\n特殊命名共计" +
        count_used_special + "位御坂妹妹\n\n", "utf8"));
    unused_buffer_list.push(Buffer.from("\n\n特殊命名共计" +
        count_unused_special + "位御坂妹妹\n\n", "utf8"));

    used_buffer_list.push(Buffer.from("\n\n共计" +
        count_used + "位御坂妹妹", "utf8"));
    unused_buffer_list.push(Buffer.from("\n\n共计" +
        count_unused + "位御坂妹妹", "utf8"));


    let result_path = path.join(__dirname, "result", moment().format("YYYY-MM-DD HH-mm-ss"));
    await fsPromises.mkdir(result_path, {recursive: true});
    let used_file = await fsPromises.open(path.join(result_path, "used.txt"), "w");
    let unused_file = await fsPromises.open(path.join(result_path, "unused.txt"), "w");
    await used_file.write(Buffer.concat(used_buffer_list));
    await unused_file.write(Buffer.concat(unused_buffer_list));
    await used_file.close();
    await unused_file.close();
    if (has_error) {
        let error_file = await fsPromises.open(path.join(result_path, "error.txt"), "w");
        await error_file.write(Buffer.concat(error_buffer_list));
        await error_file.close();

    }
}

let running = main();