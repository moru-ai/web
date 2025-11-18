import Docker from "dockerode";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    docker: Docker;
  }
}

export default fp(
  async (app) => {
    const socketPath = app.env.DOCKER_SOCKET_PATH ?? "/var/run/docker.sock";
    const docker = new Docker({ socketPath });

    app.decorate("docker", docker);
  },
  {
    name: "app.docker",
    dependencies: ["app.env"],
  },
);
