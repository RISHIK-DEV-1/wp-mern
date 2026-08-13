import Contact from "../models/Contact.js";
import User from "../models/User.js";

/* ================= GET MY CONTACTS ================= */

export const getContacts = async (req, res) => {
  try {
    const { userId } = req.params;

    const contacts = await Contact.find({
      owner: userId,
    })
      .populate(
        "contact",
        "-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires"
      )
      .sort({
        createdAt: -1,
      });

    res.json(
      contacts.map((item) => item.contact)
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= ADD CONTACT ================= */

export const addContact = async (req, res) => {
  try {
    const {
      userId,
      contactId,
    } = req.body;

    if (!userId || !contactId) {
      return res.status(400).json({
        message:
          "User ID and contact ID are required",
      });
    }

    if (String(userId) === String(contactId)) {
      return res.status(400).json({
        message:
          "You cannot add yourself as a contact",
      });
    }

    /*
     * Both users must exist in the master
     * verified-users collection.
     */
    const [owner, contactUser] =
      await Promise.all([
        User.findById(userId),
        User.findById(contactId),
      ]);

    if (!owner) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!contactUser) {
      return res.status(404).json({
        message:
          "Contact user not found",
      });
    }

    /*
     * Check whether contact already exists.
     */
    const existingContact =
      await Contact.findOne({
        owner: userId,
        contact: contactId,
      });

    if (existingContact) {
      return res.status(400).json({
        message:
          "User is already in your contacts",
      });
    }

    const newContact =
      await Contact.create({
        owner: userId,
        contact: contactId,
      });

    const populatedContact =
      await Contact.findById(
        newContact._id
      ).populate(
        "contact",
        "-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires"
      );

    res.status(201).json({
      message: "Contact added successfully",
      contact:
        populatedContact.contact,
    });
  } catch (error) {
    /*
     * Protect against duplicate-key errors
     * from the compound unique index.
     */
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "User is already in your contacts",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= REMOVE CONTACT ================= */

export const removeContact = async (
  req,
  res
) => {
  try {
    const {
      userId,
      contactId,
    } = req.body;

    if (!userId || !contactId) {
      return res.status(400).json({
        message:
          "User ID and contact ID are required",
      });
    }

    const deletedContact =
      await Contact.findOneAndDelete({
        owner: userId,
        contact: contactId,
      });

    if (!deletedContact) {
      return res.status(404).json({
        message:
          "Contact not found",
      });
    }

    res.json({
      message:
        "Contact removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= CHECK CONTACT ================= */

export const checkContact = async (
  req,
  res
) => {
  try {
    const {
      userId,
      contactId,
    } = req.params;

    const contact =
      await Contact.exists({
        owner: userId,
        contact: contactId,
      });

    res.json({
      isContact: !!contact,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
