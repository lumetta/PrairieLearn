// @ts-check
const sqldb = require('@prairielearn/prairielib/sql-db');

const infofile = require('../infofile');

/**
 * @param {any} courseId
 * @param {import('../course-db').CourseData} courseData
 * @param {{ [wid: string]: any }} questionIds
 */
module.exports.syncNew = async function(courseId, courseData, questionIds) {
    // We can only safely remove unused tags if both `infoCourse.json` and all
    // question `info.json` files are valid.
    const isInfoCourseValid = !infofile.hasErrors(courseData.course);
    const areAllInfoQuestionsValid = Object.values(courseData.questions).every(q => !infofile.hasErrors(q));
    const deleteUnused = isInfoCourseValid && areAllInfoQuestionsValid;

    /** @type {string[]} */
    let courseTags = [];
    if (!infofile.hasErrors(courseData.course)) {
        courseTags = courseData.course.data.tags.map(t => JSON.stringify([
            t.name,
            t.description,
            t.color,
        ]));
    }

    /** @type Set<string> */
    const knownQuestionTagsNames = new Set();
    Object.values(courseData.questions).forEach(q => {
        if (!infofile.hasErrors(q)) {
            (q.data.tags || []).forEach(t => knownQuestionTagsNames.add(t));
        }
    });
    const questionTagNames = [...knownQuestionTagsNames];

    const params = [
        !infofile.hasErrors(courseData.course),
        deleteUnused,
        courseTags,
        questionTagNames,
        courseId,
    ];

    const res = await sqldb.callOneRowAsync('sync_course_tags', params);

    /** @type {[string, any][]} */
    const newTags = res.rows[0].new_tags_json;
    const tagIdsByName = newTags.reduce((acc, [name, id]) => {
        acc.set(name, id);
        return acc;
    }, /** @type {Map<String, any>} */ (new Map()));

    /** @tyle {} */
    const questionTagsParam = [];
    Object.entries(courseData.questions).forEach(([qid, question]) => {
        if (infofile.hasErrors(question)) return;
        /** @type {Set<string>} */
        const dedupedQuestionTagNames = new Set();
        (question.data.tags || []).forEach(t => dedupedQuestionTagNames.add(t));
        const questionTagIds = [...dedupedQuestionTagNames].map(t => tagIdsByName.get(t));
        questionTagsParam.push(JSON.stringify([questionIds[qid], questionTagIds]));
    });

    await sqldb.callAsync('sync_question_tags', [questionTagsParam]);
}
