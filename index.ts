import autoprefixer from "autoprefixer";
import postcss from "postcss";
import { program } from "commander";
import pino from "pino";
import PinoPretty from "pino-pretty";

const prettyStream = PinoPretty({
  colorize: true,
});
const logger = pino(prettyStream);

program
  .requiredOption("-i, --input <path...>", "input css file path")
  .option("-o, --output <path...>", "output css file path")
  .parse(process.argv);

const options = program.opts() as { input: string[]; output?: string[] };
if (options.output && options.output.length !== options.input.length) {
  logger.fatal("Output file does not match with input file");
  process.exit(1);
}
for (const [index, input] of Object.entries(options.input)) {
  const cssFile = Bun.file(input)
    .text()
    .catch((e) => {
      logger.fatal(`Input file not resolved`);
      logger.fatal(`${e}`);
      process.exit(1);
    });

  cssFile.then((css) => {
    postcss([autoprefixer])
      .process(css)
      .catch((e) => {
        logger.fatal(`Postcss failed`);
        logger.fatal(`${e}`);
        process.exit(1);
      })
      .then((result) => {
        result.warnings().forEach((warn) => {
          logger.warn(warn.toString());
        });

        if (!options.output) {
          logger.info(`Done ${input}\n${result.css}`);
        } else {
          logger.info(`Done ${input}`);
          Bun.write(options.output[parseInt(index)], result.css).catch((e) => {
            logger.fatal("Error while writing");
            logger.fatal(`${e}`);
            process.exit(1);
          });
        }
      });
  });
}
