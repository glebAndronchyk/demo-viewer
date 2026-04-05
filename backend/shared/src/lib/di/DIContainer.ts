type AnyConstructor = new (...args: any) => object;

interface DIService {
  type: "singleton";
  deps: ServiceConstructor[];
  instance: object | null;
  constructor: AnyConstructor;
}

export type ServiceConstructor = new (...args: any) => object;

type ConstructorTuple<Params extends unknown[]> = {
  [K in keyof Params]: new (...args: any[]) => Params[K];
};

export class DIContainer {
  private _map = new Map<ServiceConstructor, DIService>();

  addInstance<T extends new (...args: any) => object>(
    service: T,
    instance: InstanceType<T>,
  ) {
    this._map.set(service, {
      type: "singleton",
      deps: [],
      constructor: service,
      instance,
    });

    return this;
  }

  addSingleton<T extends ServiceConstructor>(
    service: T,
    deps?: ConstructorTuple<ConstructorParameters<T>>,
  ) {
    this._map.set(service, {
      type: "singleton",
      deps: (deps ?? []) as ServiceConstructor[],
      constructor: service,
      instance: null,
    });

    return this;
  }

  getInstance<T extends ServiceConstructor>(key: T): InstanceType<T> {
    const definitions = this._map.get(key);

    if (!definitions) {
      throw new Error(`Service constructor not found for: ${key.name}`);
    }

    const { deps, constructor, type, instance } = definitions;

    switch (type) {
      case "singleton":
        if (instance !== null) return instance as InstanceType<T>;
        const created = new constructor(
          ...deps.map((d) => this.getInstance(d)),
        ) as InstanceType<T>;
        definitions.instance = created;
        return created;
      default:
        throw new Error(`Service constructor not found for: ${key.name}`);
    }
  }

  activate() {
    this._map.forEach((i) => {
      this.getInstance(i.constructor);
    });
  }
}
