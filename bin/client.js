#!/usr/bin/env node

import { Command, Argument } from "commander";
import readlineSync from "readline-sync";
import ansiColor from "ansi-color";
import mongoose from "mongoose";
import { Case } from "../schemas/caseSchema.js";
import { Agent } from "../schemas/agentSchema.js";
import { Session } from "../schemas/sessionSchema.js";
import { Announcement } from "../schemas/announcementSchema.js";
import dotenv from "dotenv";
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import open from "open";

dotenv.config({
  path: new URL("../.env", import.meta.url).pathname,
});

const program = new Command();
var color = ansiColor.set;
mongoose.connect(process.env.MONGO_URI, console.log("Connected successfully."));

function printText(msg, rl) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(msg);
  if (rl) {
    rl.prompt(true);
  }
}

async function saveSession(agentId) {
  const token = crypto.randomBytes(32).toString("hex");
  const newSession = new Session({
    token,
    agentId,
  });
  await newSession.save();
  const sessionPath = fileURLToPath(new URL("../.session", import.meta.url));
  fs.writeFileSync(sessionPath, token);
}

async function getUser() {
  try {
    const sessionPath = fileURLToPath(new URL("../.session", import.meta.url));
    if (!fs.existsSync(sessionPath)) {
      return null;
    }
    const token = fs.readFileSync(sessionPath, "utf-8");
    const session = await Session.findOne({ token: token.trim() });
    if (!session) {
      return null;
    }
    const agent = await Agent.findById(session.agentId);
    if (!agent) {
      return null;
    }
    return agent;
  } catch (e) {
    return null;
  }
}

printText(
  color(
    `=======================================================
███████╗████████╗██╗███╗   ██╗██╗   ██╗██╗  ██╗███████╗
██╔════╝╚══██╔══╝██║████╗  ██║██║   ██║╚██╗██╔╝██╔════╝
█████╗     ██║   ██║██╔██╗ ██║██║   ██║ ╚███╔╝ █████╗  
██╔══╝     ██║   ██║██║╚██╗██║██║   ██║ ██╔██╗ ██╔══╝  
███████╗   ██║   ██║██║ ╚████║╚██████╔╝██╔╝ ██╗███████╗
╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
=======================================================\n`,
    "green"
  )
);
program
  .name("etiNuxe")
  .description("CLI tool for the etiNuxe investigation agency");

program
  .command("login")
  .description("Login as an agent")
  .action(async (options) => {
    const name = readlineSync.question(
      color("Enter your agent name: ", "cyan")
    );
    const password = readlineSync.question(
      color("Enter your password: ", "cyan")
    );
    if (!name || !password) {
      printText(color("Agent name and password are required.", "red"));
      await mongoose.connection.close();
      return;
    }
    const foundAgent = await Agent.findOne({ name });
    if (!foundAgent) {
      printText(color("Invalid agent name.", "red"));
      await mongoose.connection.close();
    } else {
      if (foundAgent.password === password) {
        printText(color("Login successful!", "green"));
        saveSession(foundAgent.id);
        await mongoose.connection.close();
      } else {
        printText(color("Invalid password.", "red"));
        await mongoose.connection.close();
      }
    }
  });

program
  .command("logout")
  .description("Logout the current agent")
  .action(async () => {
    const sessionPath = fileURLToPath(new URL("../.session", import.meta.url));
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      printText(color("Logged out!", "green"));
    } else {
      printText(color("No session found.", "yellow"));
    }
    await mongoose.connection.close();
  });

program
  .command("wenoti")
  .description("Monitor daily energy usage at Wenoti Arcade")
  .action(async () => {
    const user = await getUser();
    if (!user) {
      printText(color("You must be logged in to use this command.", "red"));
      await mongoose.connection.close();
      return;
    }
    printText(color("Energy usage at Wenoti Arcade:\n", "cyan"));
    for (let i = 0; i < 11; i++) {
      const usage = i != 3 ? Math.floor(Math.random() * 160) : 2684;
      const outputColor =
        usage < 100 ? "green" : usage <= 1000 ? "yellow" : "red";
      printText(color(`${i + 20} October: ${usage} kWh`, outputColor));
    }
    await mongoose.connection.close();
  });

program
  .command("losrebeldes", { hidden: true })
  .description("confidential")
  .action(async () => {
    const user = await getUser();
    if (!user) {
      printText(color("You must be logged in to use this command.", "red"));
      await mongoose.connection.close();
      return;
    }
    const ans = readlineSync.question(
      color("What was the hidden information in our case file: ", "cyan")
    );
    if (ans == "blueshirt") {
      printText(color("Welcome, fellow rebel.", "green"));
      setTimeout(async () => {
        await open("https://los-rebeldes.bhavitgrover.workers.dev");
        await mongoose.connection.close();
      }, 1000);
    }
  });

program
  .command("case")
  .description("Manage cases for etiNuxe.")
  .addArgument(
    new Argument("<option>", "Command option").choices([
      "new",
      "list",
      "close",
      "assign",
      "status",
    ])
  )
  .action(async (option) => {
    const user = await getUser();
    if (!user) {
      printText(color("You must be logged in to use this command.", "red"));
      await mongoose.connection.close();
      return;
    }
    if (option == "new") {
      const caseName = readlineSync.question(
        color("Enter the case name: ", "cyan")
      );
      const caseDescription = readlineSync.question(
        color("Enter the case debrief: ", "cyan")
      );
      if (!caseName || !caseDescription) {
        printText(color("Case name and debrief are required.", "red"));
        await mongoose.connection.close();
        return;
      }
      const foundCase = await Case.findOne({ title: caseName });
      if (foundCase) {
        printText(color(`A case with that name already exists.`, "red"));
        await mongoose.connection.close();
        return;
      }
      const newCase = new Case({
        title: caseName,
        description: caseDescription,
      });
      await newCase.save();
      printText(color(`New case "${caseName}" created successfully.`, "green"));
    } else if (option == "list") {
      const cases = await Case.find();
      if (cases.length === 0) {
        printText(color("No cases found.", "yellow"));
      } else {
        printText(color("List of cases:", "cyan"));
        cases.forEach((c, index) => {
          printText(
            color(
              `${index + 1}. ${c.title} - ${c.description} (${
                c.isOpen ? "Open" : "Closed"
              })`,
              c.isOpen ? "green" : "yellow"
            )
          );
        });
      }
    } else if (option == "close") {
      const caseName = readlineSync.question(
        color("Enter the case name: ", "cyan")
      );
      const foundCase = await Case.findOne({ title: caseName });
      if (!foundCase) {
        printText(color(`No case found with that name.`, "red"));
      }
      if (!foundCase.assignedTo.includes(user.id)) {
        printText(color(`You are not assigned to this case.`, "red"));
        await mongoose.connection.close();
        return;
      }
      const report = readlineSync.question(
        color(
          "Please enter your report of the case before closing it: ",
          "cyan"
        )
      );
      foundCase.isOpen = false;
      foundCase.report = report;
      await foundCase.save();
      printText(color(`Case "${caseName}" closed successfully.`, "green"));
    } else if (option == "assign") {
      const caseName = readlineSync.question(
        color("Enter the case name: ", "cyan")
      );
      const foundCase = await Case.findOne({ title: caseName });
      if (!foundCase) {
        printText(color(`No case found with that name.`, "red"));
        await mongoose.connection.close();
        return;
      }
      const agentName = readlineSync.question(
        color("Enter the agent name to assign: ", "cyan")
      );
      const foundAgent = await Agent.findOne({ name: agentName });
      if (!foundAgent) {
        printText(color(`No agent found with that name.`, "red"));
        await mongoose.connection.close();
        return;
      }
      if (foundCase.assignedTo.includes(foundAgent.id)) {
        printText(color(`Agent is already assigned to this case.`, "yellow"));
        await mongoose.connection.close();
        return;
      }
      foundCase.assignedTo.push(foundAgent.id);
      await foundCase.save();
      printText(color(`Agent assigned successfully.`, "green"));
    } else if (option == "status") {
      const caseName = readlineSync.question(
        color("Enter the case name: ", "cyan")
      );
      const foundCase = await Case.findOne({ title: caseName });
      if (!foundCase) {
        printText(color(`No case found with that name.`, "red"));
        await mongoose.connection.close();
        return;
      }
      console.log("");
      printText(color(`Title: ${foundCase.title}`, "cyan"));
      printText(color(`Description: ${foundCase.description}`, "cyan"));
      printText(
        color(`This case has been assigned to the following agents:`, "cyan")
      );
      if (foundCase.assignedTo.length === 0) {
        printText(color("No agents assigned to this case.", "yellow"));
      }
      for (const agentId of foundCase.assignedTo) {
        const agent = await Agent.findById(agentId);
        if (agent) {
          printText(color(`- ${agent.name}`, "white"));
        }
      }
      if (foundCase.isOpen) {
        printText(color("This case is currently open.", "green"));
      } else {
        printText(color("This case is currently closed.", "yellow"));
        printText(color("\nReport:", "cyan"));
        printText(color(foundCase.report, "white"));
        console.log("");
      }
    } else {
      printText(color(`Invalid option "${option}".`, "red"));
    }
    await mongoose.connection.close();
  });

program
  .command("announcements")
  .description("View and add announcements for the agency.")
  .addArgument(
    new Argument("<option>", "Command option").choices([
      "add",
      "list",
      "delete",
    ])
  )
  .action(async (option) => {
    const user = await getUser();
    if (!user) {
      printText(color("You must be logged in to use this command.", "red"));
      await mongoose.connection.close();
      return;
    }
    if (option == "add") {
      const title = readlineSync.question(
        color("Announcement title: ", "cyan")
      );
      const content = readlineSync.question(
        color("Enter the announcement: ", "cyan")
      );
      if (!title || !content) {
        printText(color("Title and content are required.", "red"));
        await mongoose.connection.close();
        return;
      }
      const newAnnouncement = new Announcement({ title, content });
      await newAnnouncement.save();
      printText(color(`Announcement added successfully.`, "green"));
    } else if (option == "list") {
      const announcements = await Announcement.find();
      if (announcements.length === 0) {
        printText(color("No announcements found.", "yellow"));
      } else {
        printText(color("List of announcements:", "cyan"));
        announcements.forEach((a, index) => {
          printText(color(`${index + 1}. ${a.title} - ${a.content}`, "green"));
        });
      }
    } else if (option == "delete") {
      printText(color("Current Announcements: ", "cyan"));
      const announcements = await Announcement.find();
      if (announcements.length === 0) {
        printText(color("No announcements found.", "yellow"));
        await mongoose.connection.close();
        return;
      }
      announcements.forEach((a, index) => {
        printText(color(`${index + 1}. ${a.title}`, "green"));
      });
      const title = readlineSync.question(
        color("Enter the title of the announcement to delete: ", "cyan")
      );
      const foundAnnouncement = await Announcement.findOne({ title });
      if (!foundAnnouncement) {
        printText(color(`No announcement found with that title.`, "red"));
        await mongoose.connection.close();
        return;
      }
      await Announcement.deleteOne({ _id: foundAnnouncement._id });
      printText(color(`Announcement deleted successfully.`, "green"));
    }
    await mongoose.connection.close();
  });

program.parse();
