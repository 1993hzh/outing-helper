const BizError = require('../bizError')

class BuildingService {

  #BUILT_IN = [
    { id: 1, name: "1号" },
    { id: 2, name: "2号" },
    { id: 3, name: "3号" },
    { id: 4, name: "4号" },
    { id: 5, name: "5号" },
    { id: 6, name: "6号" },
    { id: 7, name: "7号" },
    { id: 8, name: "8号" },
    { id: 9, name: "9号" },
    { id: 10, name: "10号" },
    { id: 11, name: "11号" },
    { id: 12, name: "12号" },
    { id: 13, name: "13号" },
    { id: 14, name: "14号" },
    { id: 15, name: "15号" },
    { id: 16, name: "16号" },
    { id: 17, name: "17号" },
    { id: 18, name: "18号" },
    { id: 19, name: "19号" },
    { id: 20, name: "20号" },
    { id: 21, name: "21号" },
    { id: 22, name: "22号" },
    { id: 23, name: "23号" },
    { id: 24, name: "24号" },
    { id: 25, name: "25号" },
    { id: 26, name: "26号" },
    { id: 27, name: "27号" },
    { id: 29, name: "29号" },
    { id: 30, name: "30号" },
    { id: 31, name: "31号" },
    { id: 32, name: "32号" },
    { id: 33, name: "33号" },
    { id: 34, name: "34号" },
    { id: 35, name: "35号" },
    { id: 36, name: "36号" },
    { id: 37, name: "37号" },
    { id: 38, name: "38号" },
    { id: 39, name: "39号" },
    { id: 40, name: "40号" },
    { id: 41, name: "41号" },
    { id: 42, name: "42号" },
    { id: 43, name: "43号" },
    { id: 44, name: "44号" },
    { id: 45, name: "45号" },
    { id: 47, name: "47号" },
    { id: 48, name: "48号" },
    { id: 49, name: "49号" },
    { id: 50, name: "50号" },
    { id: 52, name: "52号" },
    { id: 53, name: "53号" },
    { id: 54, name: "54号" },
    { id: 56, name: "56号" },
    { id: 57, name: "57号" },
    { id: 58, name: "58号" },
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
    return [];
    // return this.#BUILT_IN;
  }
}

module.exports = BuildingService;