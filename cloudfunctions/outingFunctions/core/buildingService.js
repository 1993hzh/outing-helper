class BuildingService {

  #BUILT_IN = [
    { id: 1, name: "56号楼" },
    { id: 2, name: "57号楼" },
    { id: 3, name: "58号楼" },
  ];

  #INDEXED_BUILDINGS = new Map();

  constructor() {
    this.#BUILT_IN.forEach(e => {
      this.#INDEXED_BUILDINGS.set(e.name, e);
    });
  }

  async findByName(name) {
    return this.#INDEXED_BUILDINGS.get(name);
  }
}

module.exports = BuildingService;