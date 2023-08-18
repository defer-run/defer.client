import { json} from "@remix-run/node"
import { useLoaderData } from "@remix-run/react";
import { addMetadata } from "../../../../dist/esm/index";

import helloWorld from "../defer/helloWorld";

export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
  const helloWorldIndex = addMetadata(helloWorld, { route: "Index" })
  const execution = await helloWorldIndex()
  return json(execution)
}

export default function Index() {
  const execution = useLoaderData()

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/blog"
            rel="noreferrer"
          >
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/jokes"
            rel="noreferrer"
          >
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/docs" rel="noreferrer">
            Remix Docs
          </a>
        </li>
        <li>
          {JSON.stringify(execution, null, 2)}
        </li>
      </ul>
    </div>
  );
}
