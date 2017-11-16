"use strict"

let finalData;

/**
 * @param {string[] | BagArray} voters
 */
async function AssocByVoters(voters)
{
    if (voters[0].hasOwnProperty("count"))
        voters = voters.mapToProp("key");
    const uid0 = new Set(voters);
    uid0.delete("");//except anonymous user
    /**@type {string[]}*/
    const uids = uid0.toArray();

    /**@type {BagArray}*/
    const anss = await DBfunc("getAnsIdByVoter", voters, "desc");
    console.log(`${anss.length} answers`, anss);
    /**@type {{[x:number]: Answer}}*/
    const ansMap = await DBfunc("getDetailMapOfIds", "answers", anss.mapToProp("key"), "id");
    /**@type {{[x:number]: Question}}*/
    const qstMap = await DBfunc("getDetailMapOfIds", "questions", Object.values(ansMap).mapToProp("question"), "id");
    /**@type {{[x:string]: string}}*/
    const usrMap = await DBfunc("getPropMapOfIds", "users", Object.values(ansMap).mapToProp("author"), "name");
    const data = [];
    for (let idx = 0; idx < anss.length; ++idx)
    {
        const cur = anss[idx];
        const ans = ansMap[cur.key];
        if (ans == null)
        {
            data.push({ ansid: cur.key, qst: { qid: -1 }, author: { name: "", id: "" }, date: -1, count: cur.count });
            continue;
        }
        const qstid = ans.question;
        const qst = qstMap[qstid];
        const title = qst == null ? qstid : qst.title;
        const athname = usrMap[ans.author];
        const author = { name: athname == null ? ans.author : athname, id: ans.author };
        const dat = { ansid: ans.id, qst: { title: title, aid: ans.id, qid: qstid }, author: author, date: ans.timeC, count: cur.count };
        data.push(dat);
    }

    $("#maintable").DataTable(
        {
            paging: true,
            lengthMenu: [[20, 50, 100, -1], [20, 50, 100, "All"]],
            data: data,
            order: [[4, "desc"]],
            columns:
            [
                { data: "ansid" },
                {
                    data: "qst",
                    render: displayRender(dat => dat.qid == -1 ? "" : `<a class="bgopen" href="https://www.zhihu.com/question/${dat.qid}/answer/${dat.aid}">${dat.title}</a>`,
                        dat => dat.qid),
                },
                {
                    data: "author",
                    render: displayRender(dat => `<a class="bgopen" href="https://www.zhihu.com/people/${dat.id}">${dat.name}</a>`, dat => dat.name),
                },
                {
                    data: "date",
                    render: displayRender(dat => dat === -1 ? "No record" : new Date(dat * 1000).toLocaleString()),
                },
                { data: "count" }
            ]
        });
    finalData = data;
}

$(document).on("click", "#stat", e =>
{
    chrome.runtime.sendMessage({ action: "openpage", target: window.location.href.replace("AssocAns", "StatVoter"), isBackground: true });
});
$(document).on("click", "#export", e =>
{
    const head = "\uFEFF" + "answerId,questionId,标题,作者,authorId,日期,计数\n";
    let txt = head;
    finalData.forEach(dat => txt += `${dat.ansid},${dat.qst.qid},${dat.qst.title},${dat.author.name},${dat.author.id},${dat === -1 ? "No record" : new Date(dat * 1000).toLocaleString()},${dat.count}\n`);
    const time = new Date().Format("yyyyMMdd-hhmm");
    chrome.runtime.sendMessage({ action: "download", type: "txt", data: txt, fname: `AssocAns-${time}.csv` });
});

!async function()
{
    /**@type {{[x: string]: string}}*/
    const qs = _getQueryString();

    let voters;

    if (qs.artid != null)
    {
        const artid = qs.artid.split("*").map(Number);
        voters = await DBfunc("getVoters", artid, "article");
    }
    else if (qs.votid != null)
    {
        voters = qs.votid.split("*");
    }
    else
    {
        /**@type {number[]}*/
        let ansid;
        if (qs.ansid != null)
        {
            ansid = qs.ansid.split("*").map(Number);
        }
        else if (qs.authorid != null)
        {
            const athid = qs.authorid.split("*");
            ansid = (await DBfunc("getAnsIdByVoter", athid)).mapToProp("key");
        }
        else
            return;
        voters = await DBfunc("getVoters", ansid, "answer");
    }
    if (voters != null)
        AssocByVoters(voters);
}()

