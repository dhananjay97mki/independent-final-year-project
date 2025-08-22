exports.getHeat = async (req, res, next) => {
  try {
    const { bounds, companyId } = req.query;

    const query = {
      'preferences.allowMap': true,
      'currentCity.loc': { $exists: true }
    };

    if (bounds) {
      query['currentCity.loc'] = {
        $geoWithin: { $box: toMongoBounds(bounds) }
      };
    }

    if (companyId) {
      query['placement.company'] = companyId;
    }

    const users = await User.find(query)
      .select('currentCity.loc')
      .lean();

    // ✅ Filter only users with valid coordinates
    const heatPoints = users
      .filter(user => user.currentCity?.loc?.coordinates?.length === 2)
      .map(user => ({
        lng: user.currentCity.loc.coordinates[0],
        lat: user.currentCity.loc.coordinates[1],
        intensity: 1
      }));

    sendResponse(res, heatPoints);
  } catch (error) {
    next(error);
  }
};
