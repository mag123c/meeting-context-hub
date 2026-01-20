import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { createServices } from "../../core/factories.js";
import { handleMeetingInput } from "../../input/meeting.handler.js";

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
      // stdout으로 설정해서 console.log와 순서 보장
      const spinner = ora({ stream: process.stdout });
      try {
        const services = createServices();

        // Meeting 옵션 처리 (별도 UseCase)
        if (options.meeting) {
          spinner.start("Processing meeting transcript...");
          const meetingInput = await handleMeetingInput(options.meeting);

          // project/sprint 옵션 추가
          if (options.project) meetingInput.project = options.project;
          if (options.sprint) meetingInput.sprint = options.sprint;

          spinner.text = "Analyzing meeting (extracting summary, action items)...";
          const meeting = await services.summarizeMeetingUseCase.execute(meetingInput);
          spinner.succeed("Meeting processed and saved!");

          // project/sprint: CLI 옵션 > AI 추출
          const finalProject = options.project || meeting.summary.project;
          const finalSprint = options.sprint || meeting.summary.sprint;

          console.log(chalk.green("\nMeeting summary created:"));
          console.log(chalk.gray("  ID:"), meeting.id);
          console.log(chalk.gray("  Title:"), meeting.summary.title);
          console.log(chalk.gray("  Date:"), meeting.summary.date || "-");
          console.log(chalk.gray("  Participants:"), meeting.summary.participants.join(", "));
          console.log(chalk.gray("  Tags:"), meeting.tags.join(", "));
          if (finalProject) console.log(chalk.gray("  Project:"), finalProject);
          if (finalSprint) console.log(chalk.gray("  Sprint:"), finalSprint);
          
          console.log(chalk.cyan("\n📋 Summary:"));
          console.log("  " + meeting.summary.summary);

          if (meeting.summary.decisions.length > 0) {
            console.log(chalk.cyan("\n🎯 Decisions:"));
            meeting.summary.decisions.forEach((d) => console.log("  - " + d));
          }

          if (meeting.summary.actionItems.length > 0) {
            console.log(chalk.cyan("\n✅ Action Items:"));
            meeting.summary.actionItems.forEach((item) => {
              const assignee = item.assignee ? " (@" + item.assignee + ")" : "";
              const deadline = item.deadline ? " [" + item.deadline + "]" : "";
              console.log("  - " + item.task + assignee + deadline);
            });
          }

          if (meeting.summary.nextSteps.length > 0) {
            console.log(chalk.cyan("\n📅 Next Steps:"));
            meeting.summary.nextSteps.forEach((s) => console.log("  - " + s));
          }

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

        // project/sprint 옵션 추가
        if (options.project) input.project = options.project;
        if (options.sprint) input.sprint = options.sprint;

        spinner.start("Processing context (tagging, summarizing, embedding)...");
        const context = await services.addContextUseCase.execute(input);
        spinner.succeed("Context saved!");

        console.log(chalk.green("\nContext created:"));
        console.log(chalk.gray("  ID:"), context.id);
        console.log(chalk.gray("  Type:"), context.type);
        console.log(chalk.gray("  Summary:"), context.summary);
        console.log(chalk.gray("  Tags:"), context.tags.join(", "));
        if (context.source) {
          console.log(chalk.gray("  Source:"), context.source);
        }
        if (context.project) {
          console.log(chalk.gray("  Project:"), context.project);
        }
        if (context.sprint) {
          console.log(chalk.gray("  Sprint:"), context.sprint);
        }
      } catch (error) {
        spinner.fail("Failed to add context");
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return cmd;
}
