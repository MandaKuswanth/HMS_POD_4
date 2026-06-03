const express = require("express");
const router = express.Router();

const {
    createNode,
    getAllNodes,
    getNodeById,
    updateNode,
    deleteNode,
    getRoles
} = require("../controllers/nodeController");


router.post("/", createNode);


router.get("/", getAllNodes);


router.get("/roles", getRoles);


router.get("/:id", getNodeById);


router.put("/:id", updateNode);


router.delete("/:id", deleteNode);

module.exports = router;