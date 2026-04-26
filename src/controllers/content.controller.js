const Content = require("../models/content.model");
const { CONTENT_STATUS } = Content;
const User = require("../models/user.model");
const ContentSchedule = require("../models/content_schedule.model");
const ContentSlot = require("../models/content_slots.model");

const userInclude = [
  { model: User, as: "creator", attributes: ["id", "name", "email"], required: false },
  { model: User, as: "uploader", attributes: ["id", "name", "email"], required: false },
  { model: User, as: "approver", attributes: ["id", "name", "email"], required: false },
];

function pickActiveByRotation(nowMs, items) {
  if (!items || items.length === 0) return null;
  const durationsSec = items.map((it) => Math.max(1, Number(it.durationMinutes || 5)) * 60);
  const cycle = durationsSec.reduce((a, b) => a + b, 0);
  const offset = Math.floor(nowMs / 1000) % cycle;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += durationsSec[i];
    if (offset < acc) return items[i];
  }
  return items[items.length - 1];
}

async function liveByTeacher(req, res) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (!Number.isFinite(teacherId) || teacherId <= 0) {
      return res.json({ message: "No content available" });
    }

    const subject = req.query.subject ? String(req.query.subject).toLowerCase() : null;

    const whereSlot = {};
    if (subject) {
      // invalid subject should return empty (not error)
      whereSlot.subject = subject;
    }

    const schedules = await ContentSchedule.findAll({
      include: [
        {
          model: Content,
          as: "content",
          required: true,
          where: { uploaded_by: teacherId, status: CONTENT_STATUS.APPROVED },
        },
        {
          model: ContentSlot,
          as: "slot",
          required: true,
          where: whereSlot,
        },
      ],
      order: [
        ["rotation_order", "ASC"],
        ["id", "ASC"],
      ],
    });

    if (!schedules || schedules.length === 0) {
      return res.json({ message: "No content available" });
    }

    const now = Date.now();
    const rotationItems = schedules
      .map((s) => ({
        scheduleId: s.id,
        durationMinutes: s.duration || 5,
        rotationOrder: s.rotation_order ?? 0,
        slotSubject: s.slot?.subject,
        content: s.content,
      }))
      .filter((it) => {
        const c = it.content;
        if (!c) return false;
        // Teacher controls scheduling: without start/end => not active
        if (!c.start_time || !c.end_time) return false;
        const start = new Date(c.start_time).getTime();
        const end = new Date(c.end_time).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
        return now >= start && now <= end;
      });

    if (rotationItems.length === 0) {
      return res.json({ message: "No content available" });
    }

    const active = pickActiveByRotation(Date.now(), rotationItems);
    if (!active || !active.content) {
      return res.json({ message: "No content available" });
    }

    const c = active.content;
    return res.json({
      id: c.id,
      title: c.title,
      description: c.description,
      subject: c.subject,
      file_url: c.file_url,
      file_type: c.file_type,
      file_size: c.file_size,
      uploaded_by: c.uploaded_by,
      schedule: {
        schedule_id: active.scheduleId,
        subject: active.slotSubject,
        rotation_order: active.rotationOrder,
        duration_minutes: active.durationMinutes,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not fetch live content" });
  }
}

async function create(req, res) {
  try {
    const userId = req.user.id;
    const row = await Content.create({
      title: req.body.title,
      description: req.body.description,
      subject: req.body.subject,
      file_url: req.body.file_url,
      file_type: req.body.file_type,
      file_size: req.body.file_size,
      start_time: req.body.start_time ? new Date(req.body.start_time) : null,
      end_time: req.body.end_time ? new Date(req.body.end_time) : null,
      uploaded_by: userId,
      status:
        req.body.status !== undefined
          ? String(req.body.status).toLowerCase()
          : CONTENT_STATUS.PENDING,
      created_by: userId,
    });
    const full = await Content.findByPk(row.id, { include: userInclude });
    return res.status(201).json(full);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create content" });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const existing = await Content.findByPk(id);
    if (!existing) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (req.body.uploaded_by !== undefined && req.body.uploaded_by !== null) {
      const u = await User.findByPk(req.body.uploaded_by);
      if (!u) {
        return res
          .status(400)
          .json({ message: "uploaded_by does not reference an existing user" });
      }
    }
    if (req.body.approved_by !== undefined && req.body.approved_by !== null) {
      const u = await User.findByPk(req.body.approved_by);
      if (!u) {
        return res
          .status(400)
          .json({ message: "approved_by does not reference an existing user" });
      }
    }

    const payload = {};
    const assign = (key) => {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    };
    assign("title");
    assign("description");
    assign("subject");
    assign("file_url");
    assign("file_type");
    assign("file_size");
    if (req.body.start_time !== undefined) {
      payload.start_time = req.body.start_time === null ? null : new Date(req.body.start_time);
    }
    if (req.body.end_time !== undefined) {
      payload.end_time = req.body.end_time === null ? null : new Date(req.body.end_time);
    }
    assign("uploaded_by");
    assign("status");
    assign("rejection_reason");
    assign("approved_by");
    if (req.body.approved_at !== undefined) {
      const raw = req.body.approved_at;
      payload.approved_at = raw === null ? null : new Date(raw);
    }

    if (Object.keys(payload).length === 0) {
      const row = await Content.findByPk(id, { include: userInclude });
      return res.json(row);
    }

    const [count] = await Content.update(payload, { where: { id } });
    if (count === 0) {
      return res.status(404).json({ message: "Content not found" });
    }
    const row = await Content.findByPk(id, { include: userInclude });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not update content" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await Content.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ message: "Content not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete content" });
  }
}

async function getById(req, res) {
  try {
    const row = await Content.findByPk(req.params.id, { include: userInclude });
    if (!row) {
      return res.status(404).json({ message: "Content not found" });
    }
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not load content" });
  }
}

async function getAll(req, res) {
  try {
    const rows = await Content.findAll({
      include: userInclude,
      order: [["id", "ASC"]],
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not list content" });
  }
}

module.exports = {
  create,
  update,
  remove,
  getById,
  getAll,
  liveByTeacher,
};
