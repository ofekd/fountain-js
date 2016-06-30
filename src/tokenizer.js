var sections = require('./sections');


var tokenizer = {

  clean: function (script) {
    return script.replace(sections._common.boneyard, '\n$1\n').replace(sections._common.standardizer, '\n').replace(sections._common.cleaner, '').replace(sections._common.whitespacer, '');
  },


  tokenize: function (script, language) {
    let langSections = JSON.parse(JSON.stringify(sections._common));
    let direction = '_' + sections[language]['_dir'];

    for (let i in sections[direction]) {
      langSections[i] = sections[direction][i];
    }

    for (let i in sections[language]) {
      langSections[i] = sections[language][i];
    }

    var script_lines = tokenizer.clean(script).split(langSections.splitter),
        line,
        match,
        parts,
        text,
        meta,
        i,
        x,
        length,
        dual,
        tokens = [];

    for (i in script_lines) {
      line = script_lines[i];

      // title page
      if (langSections.title_page.test(line)) {
        match = line.replace(langSections.title_page, '\n$1').split(langSections.splitter);
        for (x = 0, length = match.length; x < length; x++) {
          parts = match[x].replace(langSections.cleaner, '').split(/\:\n*/);
          tokens.push({ type: parts[0].trim().toLowerCase().replace(' ', '_'), text: parts[1].trim() });
        }
        continue;
      }

      // scene headings
      if (match = line.match(langSections.scene_heading)) {
        text = match[1] || match[2];

        if (text.indexOf('  ') !== text.length - 2) {
          if (meta = text.match(langSections.scene_number)) {
            meta = meta[2];
            text = text.replace(langSections.scene_number, '');
          }
          tokens.push({ type: 'scene_heading', text: text, scene_number: meta || undefined });
        }
        continue;
      }

      // centered
      if (match = line.match(langSections.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
      }

      // transitions
      if (match = line.match(langSections.transition)) {
        tokens.push({ type: 'transition', text: match[1] || match[2] });
        continue;
      }

      // dialogue blocks - characters, parentheticals and dialogue
      if (match = line.match(langSections.dialogue)) {
        if (match[1].indexOf('  ') !== match[1].length - 2) {
          parts = match[3].split(/(\(.+\))(?:\n+)/).reverse();

          dual_diaglogue = !!match[2];

          if (dual_diaglogue) {
            tokens.push({ type: 'dual_dialogue_begin' });
          }

          tokens.push({ type: 'dialogue_begin', dual: dual_diaglogue ? 'right' : dual ? 'left' : undefined });
          tokens.push({ type: 'character', text: match[1].trim() });

          for (x = 0, length = parts.length; x < length; x++) {
            text = parts[x].trim();

            if (text.length > 0) {
              tokens.push({ type: langSections.parenthetical.test(text) ? 'parenthetical' : 'dialogue', text: text });
            }
          }

          tokens.push({ type: 'dialogue_end' });

          if (dual_diaglogue) {
            tokens.push({ type: 'dual_dialogue_end' });
          }
          continue;
        }
      }

      // section
      if (match = line.match(langSections.section)) {
        tokens.push({ type: 'section', text: match[2], depth: match[1].length });
        continue;
      }

      // synopsis
      if (match = line.match(langSections.synopsis)) {
        tokens.push({ type: 'synopsis', text: match[1] });
        continue;
      }

      // notes
      if (match = line.match(langSections.note)) {
        tokens.push({ type: 'note', text: match[1]});
        continue;
      }

      // boneyard
      if (match = line.match(langSections.boneyard)) {
        tokens.push({ type: match[0][0] === '/' ? 'boneyard_begin' : 'boneyard_end' });
        continue;
      }

      // page breaks
      if (langSections.page_break.test(line)) {
        tokens.push({ type: 'page_break' });
        continue;
      }

      // line breaks
      if (langSections.line_break.test(line)) {
        tokens.push({ type: 'line_break' });
        continue;
      }

      // lyrics
      if (langSections.lyrics.test(line)) {
        tokens.push({ type: 'lyrics', text: line });
        continue;
      }

      tokens.push({ type: 'action', text: line });
    }

    return tokens;
  }

};

module.exports = tokenizer;
