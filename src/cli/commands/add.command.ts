import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { createServices } from "../../core/factories.js";
import { handleMeetingInput } from "../../input/meeting.handler.js";
import { withSpinner, formatContextMeta, formatMeetingResult } from "../utils/index.js";

export function createAddCommand(): Command {
  const cmd = new Command("add")
    .description("Add a new context")
    .option("-t, --text <text>", "Add text content")
    .option("-i, --image <path>", "Add image file (Claude Vision)")
    .option("-a, --audio <path>", "Add audio file (Whisper)")
    .option("-f, --file <path>", "Add file content (txt, md, csv, json)")
    .option("-m, --meeting <path>", "Add meeting transcript (txt, md)")
    .option("--project <name>", "Project name")
    .option("--sprint <name>", "Sprint identifier")
    .action(async (options) => {
      await withSpinner(async (spinner) => {
        const services = createServices();

        // Meeting 옵션 처리 (별도 UseCase)
        if (options.meeting) {
          spinner.start("Processing meeting transcript...");
          const meetingInput = await handleMeetingInput(options.meeting);

          if (options.project) meetingInput.project = options.project;
          if (options.sprint) meetingInput.sprint = options.sprint;

          spinner.text = "Analyzing meeting (extracting summary, action items)...";
          const meeting = await services.summarizeMeetingUseCase.execute(meetingInput);
          spinner.succeed("Meeting processed and saved!");

          const finalProject = options.project || meeting.summary.project;
          const finalSprint = options.sprint || meeting.summary.sprint;
          formatMeetingResult(meeting, finalProject, finalSprint);
          return;
        }

        // 기존 Context 처리
        let input;

        if (options.text) {
          input = services.textHandler.handle(options.text);
        } else if (options.image) {
          spinner.start("Analyzing image with Claude Vision...");
          input = await services.imageHandler.handle(options.image);
          spinner.succeed("Image analyzed");
        } else if (options.audio) {
          spinner.start("Transcribing audio with Whisper...");
          input = await services.audioHandler.handle(options.audio);
          spinner.succeed("Audio transcribed");
        } else if (options.file) {
          input = await services.fileHandler.handle(options.file);
        } else {
          const answers = await inquirer.prompt([
            {
              type: "input",
              name: "content",
              message: "Enter your context:",
            },
          ]);
          if (!answers.content) {
            console.log(chalk.yellow("No content provided."));
            return;
          }
          input = services.textHandler.handle(answers.content);
        }

        if (options.project) input.project = options.project;
        if (options.sprint) input.sprint = options.sprint;

        spinner.start("Processing context (tagging, summarizing, embedding)...");
        const context = await services.addContextUseCase.execute(input);
        spinner.succeed("Context saved!");

        formatContextMeta(context);
      }, { failText: "Failed to add context" });
    });

  return cmd;
}
