import express from "express";

import {
  getContacts,
  addContact,
  removeContact,
  checkContact,
} from "../controllers/contactController.js";

const router = express.Router();

/* GET MY CONTACTS */

router.get(
  "/:userId",
  getContacts
);

/* ADD CONTACT */

router.post(
  "/",
  addContact
);

/* REMOVE CONTACT */

router.delete(
  "/",
  removeContact
);

/* CHECK CONTACT */

router.get(
  "/check/:userId/:contactId",
  checkContact
);

export default router;
