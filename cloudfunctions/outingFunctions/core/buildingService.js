class BuildingService {

  #BUILT_IN = [
    { id: 1, name: "1号楼" },
    { id: 2, name: "2号楼" },
    { id: 3, name: "3号楼" },
    { id: 4, name: "4号楼" },
    { id: 5, name: "5号楼" },
    { id: 6, name: "6号楼" },
    { id: 7, name: "7号楼" },
    { id: 8, name: "8号楼" },
    { id: 9, name: "9号楼" },
    { id: 10, name: "10号楼" },
    { id: 11, name: "11号楼" },
    { id: 12, name: "12号楼" },
    { id: 13, name: "13号楼" },
    { id: 14, name: "14号楼" },
    { id: 15, name: "15号楼" },
    { id: 16, name: "16号楼" },
    { id: 17, name: "17号楼" },
    { id: 18, name: "18号楼" },
    { id: 19, name: "19号楼" },
    { id: 20, name: "20号楼" },
    { id: 21, name: "21号楼" },
    { id: 22, name: "22号楼" },
    { id: 23, name: "23号楼" },
    { id: 24, name: "24号楼" },
    { id: 25, name: "25号楼" },
    { id: 26, name: "26号楼" },
    { id: 27, name: "27号楼" },
    { id: 29, name: "29号楼" },
    { id: 30, name: "30号楼" },
    { id: 31, name: "31号楼" },
    { id: 32, name: "32号楼" },
    { id: 33, name: "33号楼" },
    { id: 34, name: "34号楼" },
    { id: 35, name: "35号楼" },
    { id: 36, name: "36号楼" },
    { id: 37, name: "37号楼" },
    { id: 38, name: "38号楼" },
    { id: 39, name: "39号楼" },
    { id: 40, name: "40号楼" },
    { id: 41, name: "41号楼" },
    { id: 42, name: "42号楼" },
    { id: 43, name: "43号楼" },
    { id: 44, name: "44号楼" },
    { id: 45, name: "45号楼" },
    { id: 47, name: "47号楼" },
    { id: 48, name: "48号楼" },
    { id: 49, name: "49号楼" },
    { id: 50, name: "50号楼" },
    { id: 52, name: "52号楼" },
    { id: 53, name: "53号楼" },
    { id: 54, name: "54号楼" },
    { id: 56, name: "56号楼" },
    { id: 57, name: "57号楼" },
    { id: 58, name: "58号楼" },
    { id: 59, name: "348号" },
    { id: 60, name: "350号" },
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

  async list() {
    return this.#BUILT_IN;
  }
}

module.exports = BuildingService;