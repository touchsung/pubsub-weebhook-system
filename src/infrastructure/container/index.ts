interface Container {
  register<T>(name: string, factory: () => T): void;
  resolve<T>(name: string): T;
}

export class DIContainer implements Container {
  private readonly services = new Map<string, any>();
  private readonly factories = new Map<string, () => any>();

  register<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  resolve<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    const service = factory();
    this.services.set(name, service);
    return service;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    diContainer: Container;
  }
}
