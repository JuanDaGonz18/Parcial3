router.get("/rooms/:id/history", async (req, res) => {
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;

  const result = await db.query(
    `SELECT * FROM messages
     WHERE room_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.params.id, limit, offset]
  );

  res.json(result.rows);
});
