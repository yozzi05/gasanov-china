// Для тестов (npm test): Node сам читает TypeScript, но не подставляет расширение
// в относительных импортах вида "./calcTariff". Эта подсказка добавляет ".ts".
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (/^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]s$/.test(specifier))
        return nextResolve(`${specifier}.ts`, context);
      throw err;
    }
  },
});
