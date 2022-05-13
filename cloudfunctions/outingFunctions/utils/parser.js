const data = require('../resources/data')
const BuidingService = require('../core/buildingService')
const buildingService = new BuidingService();

function parse(residenceService) {
  const raw = data.split('；');
  const array = raw.filter(e => e !== undefined && e.trim() != '');
  array.forEach((r, idx) => {
    setTimeout(async () => {
      await execute(residenceService, r);
    }, 35 * idx);
  })
};

async function execute(residenceService, value) {
  const array = value.split('号');
  const buildingName = array[0] + '号';
  const room = array[1];
  try {
    const building = await buildingService.findByName(buildingName);
    await residenceService.create({
      building: building,
      room: room,
      find: false
    });
  } catch (err) {
    console.error(err)
  }
}

module.exports = parse;